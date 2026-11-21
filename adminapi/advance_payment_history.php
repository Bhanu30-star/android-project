<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['searchparty']))
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d");
	$cdate22 = date("Y-m-d");
	
	$final_flag=0;
	$searchparty1=$_POST['searchparty'];
	$search_party=explode("-",$searchparty1);
	$party_name_val=trim($search_party[0]);
	$party_phone_val=trim($search_party[1]);
	$res_party_check = mysqli_query($con,"select party_id,party_name from tbl_party where party_name='$party_name_val' and party_phone='$party_phone_val' and distributor_id='$ver'");
	while($row_party = mysqli_fetch_array($res_party_check))
	{
		$pid=$row_party['party_id'];
		$party_name=$row_party['party_name'];
		$advancepayment_detail=array();
		$res1 = mysqli_query($con,"select * from tbl_other_receipt_txn where party_id='$pid' and receipt_type='Advance' order by adjustment_status desc");
		if(mysqli_num_rows($res1)>0)
		{
			$final_flag=1;
			while($fetch_product=mysqli_fetch_array($res1)) 
			{ 
				extract($fetch_product);
				$advancepayment_detail['party_id']=$pid;
				$advancepayment_detail['party_name']=$party_name;
				$advancepayment_detail['id']=$receipt_txn_id;
				$advancepayment_detail['unique_bill']=$user_receipt_id;
				$advancepayment_detail['receipt_date']=date("d-M-Y", strtotime($receipt_date))." ".$receipt_time;
				$advancepayment_detail['bill_amount']=round($total_amount);
				$advancepayment_detail['adjust_amount']=round($adjust_amount);
				$advancepayment_detail['pending_amount']=round($total_amount-$adjust_amount);
				if(round($total_amount-$adjust_amount)>0)
					$advancepayment_detail['status']="Pending";
				else
					$advancepayment_detail['status']="Complete";
				$advancepayment_detail['invoice_bill']="download_other_receipt_invoice.php?id=".base64_encode($receipt_txn_id)."&user_id=".base64_encode($ver);	 
				if(round($total_amount-$adjust_amount)>0)
				{
					$calculate_credit_amt=0;
					$res_credit_check = mysqli_query($con,"SELECT sum(tbl_party_transaction.total_amount) as tamt,sum(tbl_party_transaction.cash_amount) as ramt,tbl_party.party_name FROM tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit' and tbl_user.distributor_id='$ver' and tbl_party_transaction.transaction_to='$pid'  group by tbl_party.party_id");
					while($fetch_product2=mysqli_fetch_assoc($res_credit_check))
					{
						$calculate_credit_amt=$fetch_product2['tamt']-$fetch_product2['ramt'];
					}
					if($calculate_credit_amt>0)
						$advancepayment_detail['adjust_flag']='true';
					else
						$advancepayment_detail['adjust_flag']='false';
				}
				else
				{
					$uq1=mysqli_query($con,"UPDATE tbl_other_receipt_txn SET adjustment_status='Complete' where receipt_txn_id='$receipt_txn_id' and party_id='$pid'");
					$advancepayment_detail['adjust_flag']='false';
				} 
				$response['advancepayment_detail'][]=$advancepayment_detail;
			}
		}
	}
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver', 'INSERT+UPDATE OPERATION,Advance Payment History#Admin(UPDATE)tbl_other_receipt_txn,', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	if($final_flag==0)
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
	else
	{
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>