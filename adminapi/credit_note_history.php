<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
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
	$cdate1=isset($_POST['cdate1']) ? $_POST['cdate1'] : $cdate11;
	$cdate2=isset($_POST['cdate2']) ? $_POST['cdate2'] : $cdate22;
	$searchparty1=$_POST['searchparty'];
	$search_party=explode("-",$searchparty1);
	$party_name_val=trim($search_party[0]);
	$party_phone_val=trim($search_party[1]);
	
	
	$query="select *,sum(final_net_amt) as final_bill_amt,sum(adjust_amount) as final_adjust_amt from tbl_party_credit_note,tbl_party where tbl_party_credit_note.party_id=tbl_party.party_id and tbl_party_credit_note.distributor_id='$ver' and tbl_party_credit_note.bill_date>='$cdate1' and tbl_party_credit_note.bill_date<='$cdate2'";
	if($searchparty1!="")
	{
		$query=$query." "."and (tbl_party.party_name='$party_name_val' or tbl_party.party_phone='$party_phone_val')";
	}
	$query=$query." "."group by tbl_party_credit_note.bill_no,tbl_party_credit_note.unique_bill order by tbl_party_credit_note.bill_date desc";
	$res1 = mysqli_query($con,$query);
	
	$creditnote_detail=array();
	if(mysqli_num_rows($res1)>0)
	{
		$final_flag=1;
		while($fetch_product=mysqli_fetch_array($res1)) 
		{ 
			extract($fetch_product);
			$pid=$fetch_product['party_id'];
			$party_nameval=$fetch_product['party_name'];
			$creditnote_detail['creditnote_id']=$creditnote_id;
			$creditnote_detail['txn_date']=$transaction_date;
			$creditnote_detail['party_id']=$party_id;
			$creditnote_detail['party_name']=$party_nameval;
			$creditnote_detail['billno']=$bill_no;
			$creditnote_detail['unique_bill']=$unique_bill;
			$creditnote_detail['bill_date']=date("d-M-Y", strtotime($bill_date))." ".$bill_time;
			$creditnote_detail['bill_amount']=round($final_bill_amt);
			$creditnote_detail['adjust_amount']=round($final_adjust_amt);
			$creditnote_detail['pending_amount']=round($final_bill_amt-$final_adjust_amt);
			$creditnote_detail['credit_note_type']=$credit_note_type;
			if(round($fetch_product['final_bill_amt']-$fetch_product['final_adjust_amt'])>0)
				$creditnote_detail['status']="Pending";
			else
				$creditnote_detail['status']="Complete";
			if($credit_note_type=="Direct")
				$creditnote_detail['invoice_bill']="party-credit-note-receipt_direct.php?id=".base64_encode($unique_bill)."&bid=".base64_encode($bill_no)."&user_id=".base64_encode($ver);								   
			else 
				$creditnote_detail['invoice_bill']="party-credit-note-receipt.php?id=".base64_encode($unique_bill)."&bid=".base64_encode($bill_no)."&user_id=".base64_encode($ver);	
				 
			if(round($final_bill_amt-$final_adjust_amt)>0)
			{
				$calculate_credit_amt=0;
				$pid=$party_id;
				$res_credit_check = mysqli_query($con,"SELECT sum(tbl_party_transaction.total_amount) as tamt,sum(tbl_party_transaction.cash_amount) as ramt,tbl_party.party_name FROM tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit' and tbl_user.distributor_id='$ver' and tbl_party_transaction.transaction_to='$pid'  group by tbl_party.party_id");
				while($fetch_product2=mysqli_fetch_assoc($res_credit_check))
				{
					$calculate_credit_amt=$fetch_product2['tamt']-$fetch_product2['ramt'];
				}
				if($calculate_credit_amt>0)
					$creditnote_detail['adjust_flag']='true';
				else
					$creditnote_detail['adjust_flag']='false';
			}
			else
			{
				$uq1=mysqli_query($con,"UPDATE tbl_party_credit_note SET credit_note_status='Complete' where distributor_id='$ver' and party_id='$pid' and unique_bill='$unique_bill' and bill_no='$bill_no'");
				$creditnote_detail['adjust_flag']='false';
			} 
			$response['creditnote_detail'][]=$creditnote_detail;
		}
	}
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