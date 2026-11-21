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
	
	$res = mysqli_query($con,"SELECT party_name,purchase_party_id FROM vwCreditPurchaseSummary where payment_status!='Complete' and distributor_id='$ver' group by purchase_party_id");
	$purchasebook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			$tamt=0;
			$ramt=0;
			$final_party_id=$fetch_product2['purchase_party_id'];
			$res1 = mysqli_query($con,"SELECT final_net_amt,pay_amount,transaction_id FROM vwCreditPurchaseSummary where payment_status!='Complete' and distributor_id='$ver' and purchase_party_id='$final_party_id'");
			while($fetch_product3=mysqli_fetch_assoc($res1))
			{
				$tamt=$tamt+$fetch_product3['final_net_amt'];
				$ramt=$ramt+$fetch_product3['pay_amount'];
				$return_amount_val=0;
				$pur_txn_id=$fetch_product3['transaction_id'];
				$res_return = mysqli_query($con,"SELECT return_net_amt FROM tbl_purchase_return_transaction where distributor_id='$session_dist_ver' and transaction_id='$pur_txn_id'");
				while($fetch_return_amt=mysqli_fetch_assoc($res_return))
				{
					$return_amount_val=$return_amount_val+$fetch_return_amt['return_net_amt'];
				}
			}
			$purchasebook['party_name']=$fetch_product2['party_name'];
			$purchasebook['total_amount']=$tamt-$return_amount_val;
			$purchasebook['paid_amount']=$ramt;
			$purchasebook['pending_amount']=$tamt-$ramt-$return_amount_val;
			
			$purchasebook['purchasebookdetail']=array(); 
			$res11=mysqli_query($con,"SELECT final_net_amt,pay_amount,party_name,purchase_party_id,bill_no,bill_date,transaction_date,product_name,quantity,transaction_id FROM vwCreditPurchaseSummary where payment_status!='Complete' and distributor_id='$ver' and purchase_party_id='$final_party_id' order by transaction_id");
			while($fetch_product11=mysqli_fetch_assoc($res11))
			{
				$return_quantity_val=0;
				$actual_return_amt1=0;
				$pur_txn_id=$fetch_product11['transaction_id'];
				$res_return1 = mysqli_query($con,"SELECT return_net_amt as return_final_amt,return_quantity FROM tbl_purchase_return_transaction where distributor_id='$ver' and transaction_id='$pur_txn_id'");
				while($fetch_return_amt1=mysqli_fetch_assoc($res_return1))
				{
					$return_quantity_val=$return_quantity_val+$fetch_return_amt1['return_quantity'];
					$actual_return_amt1=$actual_return_amt1+$fetch_return_amt1['return_final_amt'];
				}
				$purchasebookdetail['bill_no']=$fetch_product11['bill_no'];
				$purchasebookdetail['bill_date']=$fetch_product11['bill_date'];
				$purchasebookdetail['transaction_date']=$fetch_product11['transaction_date'];
				$purchasebookdetail['product_name']=$fetch_product11['product_name']; 
				$purchasebookdetail['quantity']=$fetch_product11['quantity'];
				$purchasebookdetail['final_net_amt']=$fetch_product11['final_net_amt']-$actual_return_amt1;
				$purchasebookdetail['pay_amount']=$fetch_product11['pay_amount'];
				$purchasebookdetail['pending_amount']=$fetch_product11['final_net_amt']-$fetch_product11['pay_amount'];
				$purchasebook['purchasebookdetail'][]=$purchasebookdetail;
			}
			$response['purchasebook'][]=$purchasebook;
		}
		$response['success']='1';
		$response['details']="Bill Successfully Fetch";
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