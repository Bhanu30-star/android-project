<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) &&  isset($_POST['distributor_id']))
{
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$session_dist_ver = $_POST['distributor_id'];
	$searchhead = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
	 
	if(isset($searchhead) && $searchhead!='')
    {
		$query = "select * from tbl_promoter_salary_detail,tbl_user where tbl_promoter_salary_detail.user_id=tbl_user.user_id and tbl_promoter_salary_detail.distributor_id='$session_dist_ver' and tbl_promoter_salary_detail.status ='Active' and tbl_promoter_salary_detail.transaction_date>='$cdate1' and tbl_promoter_salary_detail.transaction_date<='$cdate2' and tbl_user.user_id='$searchhead' order by tbl_promoter_salary_detail.month asc";
	}
	else
	{
		$query = "select * from tbl_promoter_salary_detail,tbl_user where tbl_promoter_salary_detail.user_id=tbl_user.user_id and tbl_promoter_salary_detail.distributor_id='$session_dist_ver' and tbl_promoter_salary_detail.status ='Active' and tbl_promoter_salary_detail.transaction_date>='$cdate1' and tbl_promoter_salary_detail.transaction_date<='$cdate2' order by tbl_promoter_salary_detail.month asc";
	}

	$res = mysqli_query($con,$query);
	$historybook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$historybook['id']=$fetch_product['id'];
			$historybook['user_id']=$fetch_product['user_id'];
			$historybook['user_name']=$fetch_product['user_name'];
			$historybook['month']=$fetch_product['month'];
			$historybook['amount']=$fetch_product['amount'];
			$historybook['expense_amt']=$fetch_product['expense_amt'];
			$historybook['addition_amt']=$fetch_product['addition_amt'];
			$historybook['deduction_amt']=$fetch_product['deduction_amt'];
			$historybook['final_payble_amt']=$fetch_product['final_payble_amt'];
			$historybook['remark']=$fetch_product['remark'];
			$historybook['transaction_date']=$fetch_product['transaction_date'];
			$historybook['transaction_time']=$fetch_product['transaction_time'];
			$response['historybook'][]=$historybook;
		}
	}
	else
	{
		$response['historybook']=$historybook;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>