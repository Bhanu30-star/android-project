<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$pid = $_POST['party_id'];
	$session_dist_ver = $_POST['distributor_id'];
	if($pid>0)
		$res1 = mysqli_query($con,"select * from tbl_purchase_advance_txn_detail where party_id='$pid'  and status='Complete'");
	else
		$res1 = mysqli_query($con,"select * from tbl_purchase_advance_txn_detail where distributor_id='$session_dist_ver' and status='Complete'");
	$advance_txn_detail=array();
	if(mysqli_num_rows($res1)>0)
	{     
		while($fetch_operator=mysqli_fetch_assoc($res1))
		{	
			$pid=$fetch_operator['party_id'];
			$res_party_check = mysqli_query($con,"select party_name from tbl_purchase_party where purchase_party_id='$pid' and distributor_id='$session_dist_ver'");
			$row_party = mysqli_fetch_array($res_party_check);
			$party_name=$row_party['party_name'];
			$advance_txn_detail['receipt_txn_id'] = $fetch_operator['receipt_txn_id'];
			$advance_txn_detail['payment_mode'] = $fetch_operator['payment_mode'];
			$advance_txn_detail['party_id'] = $pid;
			$advance_txn_detail['party_name'] = $party_name;
			if($fetch_operator['bank_id']>0) { 
				$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_operator['bank_id']."'");
				if(mysqli_num_rows($bank_matser_detail)>0)
				{     
					$fetch_product=mysqli_fetch_array($bank_matser_detail);
					$advance_txn_detail['bank_detail']= $fetch_product['bank_name'].'-'.$fetch_product['account_no'];
				} 
			}
			else
			{
				$advance_txn_detail['bank_detail']='';
			}
			$advance_txn_detail['receipt_date'] = $fetch_operator['receipt_date'];
			$advance_txn_detail['receipt_time'] = $fetch_operator['receipt_time'];
			$advance_txn_detail['total_amount'] = $fetch_operator['total_amount'];
			$advance_txn_detail['adjust_amount'] = $fetch_operator['adjust_amount'];
			$advance_txn_detail['remark'] = $fetch_operator['remark'];
			$advance_txn_detail['adjust_flag'] = 'No';
			$res = mysqli_query($con,"SELECT sum(final_net_amt) as bill_final_amt,sum(pay_amount) as paid_amt FROM tbl_distributor_transaction where payment_status!='Complete' and payment_mode='Credit' and distributor_id='$session_dist_ver' and party_id='$pid' group by unique_bill,bill_no");	
			while($fetch_product2=mysqli_fetch_assoc($res))
			{
				if($fetch_product2['bill_final_amt']-$fetch_product2['paid_amt']>0)
					$advance_txn_detail['adjust_flag'] = 'Yes';
			}
				
			$response['advance_txn_detail'][]=$advance_txn_detail;
		}
	}
	else
	{
		$response['advance_txn_detail']=$advance_txn_detail;
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing!!";
}	
echo json_encode($response);
?>