<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$final_flag=0;
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	
	$res = mysqli_query($con,"select *,sum(tbl_purchase_return_transaction.return_net_amt) as final_bill_amt, sum(tbl_purchase_return_transaction.adjust_amount) as final_adjust_amt from tbl_purchase_return_transaction,tbl_purchase_party where tbl_purchase_return_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_return_transaction.distributor_id='$ver' and tbl_purchase_return_transaction.debit_note='Yes' and tbl_purchase_return_transaction.debit_note_status='Pending' group by tbl_purchase_return_transaction.debit_note_receipt");
	$purchasebook=array();
	if(mysqli_num_rows($res)>0)
	{
		$final_flag=1;
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			$purchasebook['debitnote_id']=$fetch_product2['transaction_id'];
			$purchasebook['debit_note_receipt']=$fetch_product2['debit_note_receipt'];
			$purchasebook['transaction_date']=$fetch_product2['transaction_date'];
			$purchasebook['purchase_party_id']=$fetch_product2['purchase_party_id'];
			$purchasebook['party_name']=$fetch_product2['party_name'];
			$purchasebook['bill_no']=$fetch_product2['bill_no'];
			$purchasebook['bill_date']=$fetch_product2['bill_date'];
			$purchasebook['final_bill_amt']=round($fetch_product2['final_bill_amt']);	
			$purchasebook['final_adjust_amt']=$fetch_product2['final_adjust_amt'];
			$purchasebook['uniquebill']=$fetch_product2['unique_bill'];
			$purchasebook['Pending_amount']=round($fetch_product2['final_bill_amt']-$fetch_product2['final_adjust_amt']);
			$purchasebook['debit_note_type']='Purchase Return';
			$purchasebook['receipt']="debit-notes-receipt.php?id=".base64_encode($fetch_product2['unique_bill'])."&bid=".base64_encode($fetch_product2['bill_no'])."&user_id=".base64_encode($ver);
			
			if(round($fetch_product2['final_bill_amt']-$fetch_product2['final_adjust_amt'])>0)
			{
				$calculate_credit_amt=0;
				$pid=$fetch_product2['party_id'];
				$res_calculate = mysqli_query($con,"SELECT sum(final_net_amt) as bill_final_amt,sum(pay_amount) as paid_amt FROM tbl_distributor_transaction where party_id='$pid' and payment_status!='Complete' and payment_mode='Credit' and distributor_id='$ver' and txn_type='Add' group by unique_bill,bill_no");	
				while($fetch_product21=mysqli_fetch_assoc($res_calculate))
				{
					$calculate_credit_amt=$fetch_product21['bill_final_amt']-$fetch_product21['paid_amt'];
				}
				if($calculate_credit_amt>0)
					$purchasebook['adjust_flag']='true';
				else
					$purchasebook['adjust_flag']='false';
				$response['purchasebook'][]=$purchasebook;
			}
			else
			{
				$uq1=mysqli_query($con,"UPDATE tbl_purchase_return_transaction SET debit_note_status='Complete' where distributor_id='$ver' and debit_note_receipt='".$fetch_product2['debit_note_receipt']."'");
			}
		}
	}
	$res1 = mysqli_query($con,"select *,sum(tbl_party_debit_note.final_net_amt) as final_bill_amt,sum(tbl_party_debit_note.adjust_amount) as final_adjust_amt,sum(tbl_party_debit_note.tcs_amount) as final_tcs_amt from tbl_party_debit_note,tbl_purchase_party where tbl_party_debit_note.purchase_party_id=tbl_purchase_party.purchase_party_id and tbl_party_debit_note.distributor_id='$ver' and tbl_party_debit_note.debit_note_status='Pending' group by tbl_party_debit_note.bill_no,unique_bill");
	if(mysqli_num_rows($res1)>0)
	{
		$final_flag=1;
		while($fetch_product2=mysqli_fetch_assoc($res1))
		{
			$purchasebook['debitnote_id']=$fetch_product2['debitnote_id'];
			$purchasebook['debit_note_receipt']=$fetch_product2['bill_no'];
			$purchasebook['transaction_date']=$fetch_product2['transaction_date'];
			$purchasebook['purchase_party_id']=$fetch_product2['purchase_party_id'];
			$purchasebook['party_name']=$fetch_product2['party_name'];
			$purchasebook['bill_no']=$fetch_product2['bill_no'];
			$purchasebook['bill_date']=$fetch_product2['bill_date'];
			$purchasebook['final_bill_amt']=round($fetch_product2['final_bill_amt']);	
			$purchasebook['final_adjust_amt']=$fetch_product2['final_adjust_amt'];
			$purchasebook['uniquebill']=$fetch_product2['unique_bill'];
			$purchasebook['final_tcs_amt']=$fetch_product2['final_tcs_amt'];
			$purchasebook['Pending_amount']=round($fetch_product2['final_bill_amt']-$fetch_product2['final_adjust_amt']);
			$purchasebook['debit_note_type']=$fetch_product2['debit_note_type'];
			
			if($fetch_product2['debit_note_type']=="Direct")
				$purchasebook['receipt']="party-debit-note-receipt_direct.php?id=".base64_encode($fetch_product2['unique_bill'])."&bid=".base64_encode($fetch_product2['bill_no'])."&user_id=".base64_encode($ver);
			else
				$purchasebook['receipt']="party-debit-note-receipt.php?id=".base64_encode($fetch_product2['unique_bill'])."&bid=".base64_encode($fetch_product2['bill_no'])."&user_id=".base64_encode($ver);
			
			if(round($fetch_product2['final_bill_amt']-$fetch_product2['final_adjust_amt'])>0)
			{
				$pid=$fetch_product2['purchase_party_id'];
				$res_calculate = mysqli_query($con,"SELECT sum(final_net_amt) as bill_final_amt,sum(pay_amount) as paid_amt FROM tbl_distributor_transaction where party_id='$pid' and payment_status!='Complete' and payment_mode='Credit' and distributor_id='$ver' and txn_type='Add' group by unique_bill,bill_no");	
				while($fetch_product21=mysqli_fetch_assoc($res_calculate))
				{
					$calculate_credit_amt=$fetch_product21['bill_final_amt']-$fetch_product21['paid_amt'];
				}
				if($calculate_credit_amt>0)
					$purchasebook['adjust_flag']='true';
				else
					$purchasebook['adjust_flag']='false';
				$response['purchasebook'][]=$purchasebook;
			}
			else
			{
				$uq1=mysqli_query($con,"UPDATE tbl_party_debit_note SET debit_note_status='Complete' where distributor_id='$ver' and purchase_party_id='$pid' and unique_bill='".$fetch_product2['unique_bill']."' and bill_no='".$fetch_product2['bill_no']."'");
			}
		}
	}
	if($final_flag==1)
	{
		$response['success']='1';
		$response['details']="Debit Note Successfully Fetch";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>