<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	$key = $_POST['key'];
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
	
	if($key=='')
		$select_party=mysqli_query($con,"select * from tbl_party where distributor_id='$ver' and status!='Deleted'");
	else
		$select_party=mysqli_query($con,"select * from tbl_party where distributor_id='$ver' and status!='Deleted' and (party_name LIKE '%$key%' || party_phone LIKE '$key%')");
	
	if(mysqli_num_rows($select_party)>0)
	{     
		$product=array();
		while($fetch_user=mysqli_fetch_array($select_party))
		{
			$tamt=$ramt=0;
			$product['party_id']=$fetch_user['party_id'];
			$product['party_name']=$fetch_user['party_name'];
			$product['party_phone']=$fetch_user['party_phone'];
			$product['party_email']=$fetch_user['party_email'];
			$product['beat_detail']=$fetch_user['beat_detail'];
			$product['group_name']=$fetch_user['group_name'];
			$product['gstin_no']=$fetch_user['gstin_no'];
			$product['pan_it_no']=$fetch_user['pan_it_no'];
			$product['owner_name']=$fetch_user['owner_name'];
			$product['tcs_applicable']=$fetch_user['tcs_applicable'];
			$product['party_address']=$fetch_user['party_address'];
			$product['party_ship_address']=$fetch_user['party_ship_address'];
			$product['place_of_supply']=$fetch_user['place_of_supply'];
			$product['party_type']=$fetch_user['party_type'];
			$product['status']=$fetch_user['status'];
			
			$select_state=mysqli_query($con,"select * from tbl_state_master where state_name='".$fetch_user['place_of_supply']."'");
			if(mysqli_num_rows($select_state)>0)
			{
				while($fetch_state=mysqli_fetch_array($select_state))
				{
					$product['state_name']=$fetch_state['state_name'];
					$product['party_code']=$fetch_state['state_code'];
				}
			}
			else
			{
				$product['state_name']=$fetch_user['state_name'];
				$product['party_code']=$fetch_user['party_code'];
			}
			$product['party_latitude']=$fetch_user['party_latitude'];
			$product['party_longitude']=$fetch_user['party_longitude'];
			$product['party_name_hindi']=$fetch_user['party_name_hindi'];
			$product['address_hindi']=$fetch_user['address_hindi'];
			$product['ship_address_hindi']=$fetch_user['ship_address_hindi'];
			$product['outstanding_amount']=$fetch_user['outstanding_amount'];
			$product['adjusted_outstanding_amt']=$fetch_user['adjusted_outstanding_amt'];
			
			$tamt=$tamt+$fetch_user['outstanding_amount'];
			$ramt=$ramt+$fetch_user['adjusted_outstanding_amt'];
			$party_id=$fetch_user['party_id'];
			$res = mysqli_query($con,"SELECT final_amt,cash_amount FROM `tbl_party_transaction` WHERE payment_mode='Credit' and payment_status not in ('Complete','Converted') and transaction_to in (select party_id from tbl_party where `distributor_id` = '$ver' and party_id='$party_id')");
			while($fetch_product3=mysqli_fetch_assoc($res))
			{
				$tamt=$tamt+$fetch_product3['final_amt'];
				$ramt=$ramt+$fetch_product3['cash_amount'];
			}
			$credit_overdues=round($tamt-$ramt,2);
			if($credit_overdues<=0)
				$credit_overdues=0;
			$product['credit_overdues']=$credit_overdues;
			
			$product['fse_detail']=array(); 
			
			$res_query = mysqli_query($con,"select tbl_user.user_id,tbl_user.user_name,tbl_user.user_phone,tbl_user.work_type from tbl_user,tbl_party_user where tbl_party_user.user_id=tbl_user.user_id and tbl_user.distributor_id='$ver' and tbl_party_user.party_id='$party_id' and tbl_user.status='Active'");
			while($fetch_product11=mysqli_fetch_assoc($res_query))
			{
				$fse_detail['user_id']=$fetch_product11['user_id'];
				$fse_detail['user_name']=$fetch_product11['user_name'];
				$fse_detail['user_phone']=$fetch_product11['user_phone'];
				$fse_detail['work_type']=$fetch_product11['work_type'];
				$product['fse_detail'][]=$fse_detail;
			}
			
			$advance_amt=0;
			$res1 = mysqli_query($con,"select sum(final_net_amt) as final_bill_amt,sum(adjust_amount) as final_adjust_amt from tbl_party_credit_note where distributor_id='$ver' and credit_note_status='Pending' and party_id in (select party_id from tbl_party where `distributor_id` = '$ver' and party_id='$party_id') group by bill_no,unique_bill");
			while($fetch_product=mysqli_fetch_assoc($res1))
			{
				$advance_amt=$advance_amt+round($fetch_product['final_bill_amt']-$fetch_product['final_adjust_amt']);
			}		

			$res11 = mysqli_query($con,"select total_amount,adjust_amount from tbl_other_receipt_txn where party_id in (select party_id from tbl_party where `distributor_id` = '$ver' and party_id='$party_id') and adjustment_status='Pending' and receipt_type='Advance'");
			while($fetch_product1=mysqli_fetch_assoc($res11))
			{
				$advance_amt=$advance_amt+round($fetch_product1['total_amount']-$fetch_product1['adjust_amount']);
			}	
			if($advance_amt<=0)
				$advance_amt=0;
			
			$product['advance_amt']=$advance_amt;
			
			
			$response['party_detail'][]=$product;
		}
		$response['success']='1';
	    $response['details']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['details']="Party Name/Phone Doesn't Exist!";	
	}
}
else 
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>